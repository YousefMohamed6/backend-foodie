import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'analytics',
})
@UseGuards(WsJwtGuard)
export class AnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AnalyticsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      // Join room based on user role
      if (payload.role === 'ADMIN') {
        client.join('admin');
        this.logger.log(`Admin connected to analytics: ${payload.sub}`);
      } else if (payload.role === 'MANAGER') {
        client.join('manager');
        client.join(`manager_${payload.sub}`);
        this.logger.log(`Manager connected to analytics: ${payload.sub}`);
      } else if (payload.role === 'VENDOR') {
        client.join(`vendor_${payload.sub}`);
        this.logger.log(`Vendor connected to analytics: ${payload.sub}`);
      } else if (payload.role === 'DRIVER') {
        client.join(`driver_${payload.sub}`);
        this.logger.log(`Driver connected to analytics: ${payload.sub}`);
      }

      // Join general analytics room
      client.join('analytics');
    } catch (err) {
      this.logger.error(`WS Analytics connection failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Analytics client disconnected: ${user.sub}`);
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (authHeader) {
      return authHeader.split(' ')[1] || authHeader;
    }
    const queryToken = client.handshake.query?.token;
    return Array.isArray(queryToken) ? queryToken[0] : (queryToken as string);
  }

  /**
   * Subscribe to specific vendor analytics
   */
  @SubscribeMessage('subscribeVendorAnalytics')
  handleSubscribeVendor(
    @MessageBody('vendorId') vendorId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`vendor_analytics_${vendorId}`);
    this.logger.log(`Client subscribed to vendor analytics: ${vendorId}`);
    return { event: 'subscribed', vendorId };
  }

  /**
   * Subscribe to specific driver analytics
   */
  @SubscribeMessage('subscribeDriverAnalytics')
  handleSubscribeDriver(
    @MessageBody('driverId') driverId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`driver_analytics_${driverId}`);
    this.logger.log(`Client subscribed to driver analytics: ${driverId}`);
    return { event: 'subscribed', driverId };
  }

  /**
   * Subscribe to platform-wide metrics (admin only)
   */
  @SubscribeMessage('subscribePlatformMetrics')
  handleSubscribePlatform(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (user?.role === 'ADMIN') {
      client.join('platform_metrics');
      this.logger.log('Admin subscribed to platform metrics');
      return { event: 'subscribed', scope: 'platform' };
    }
    return { event: 'error', message: 'Unauthorized' };
  }

  /**
   * Broadcast order lifecycle event
   */
  broadcastOrderEvent(event: any) {
    // To all analytics listeners
    this.server.to('analytics').emit('orderEvent', event);

    // To specific vendor
    if (event.order?.vendorId) {
      this.server
        .to(`vendor_analytics_${event.order.vendorId}`)
        .emit('vendorOrderEvent', event);
    }

    // To admin
    this.server.to('admin').emit('adminOrderEvent', event);
  }

  /**
   * Broadcast delivery update
   */
  broadcastDeliveryUpdate(event: any) {
    // To all analytics listeners
    this.server.to('analytics').emit('deliveryEvent', event);

    // To specific driver
    if (event.driverId) {
      this.server
        .to(`driver_analytics_${event.driverId}`)
        .emit('driverDeliveryEvent', event);
    }

    // To admin
    this.server.to('admin').emit('adminDeliveryEvent', event);
  }

  /**
   * Broadcast payment update
   */
  broadcastPaymentUpdate(transaction: any) {
    // To admin for financial dashboard
    this.server.to('admin').emit('paymentUpdate', transaction);
  }

  /**
   * Broadcast subscription update
   */
  broadcastSubscriptionUpdate(event: any) {
    // To specific vendor
    if (event.vendorId) {
      this.server
        .to(`vendor_analytics_${event.vendorId}`)
        .emit('subscriptionUpdate', event);
    }

    // To admin
    this.server.to('admin').emit('adminSubscriptionUpdate', event);
  }

  /**
   * Broadcast generic metric update
   */
  broadcastMetricUpdate(metricType: string, value: any) {
    this.server.to('admin').emit('metricUpdate', {
      metricType,
      value,
      timestamp: new Date(),
    });

    this.server.to('platform_metrics').emit('platformMetricUpdate', {
      metricType,
      value,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast real-time dashboard stats
   */
  broadcastDashboardStats(stats: any) {
    this.server.to('admin').emit('dashboardStats', stats);
  }

  /**
   * Broadcast vendor performance ranking update
   */
  broadcastVendorRankings(rankings: any[]) {
    this.server.to('admin').emit('vendorRankings', rankings);

    // Send individual vendor their ranking
    rankings.forEach((ranking) => {
      this.server.to(`vendor_analytics_${ranking.vendorId}`).emit('myRanking', {
        rank: ranking.rank,
        score: ranking.score,
        category: ranking.category,
      });
    });
  }

  /**
   * Broadcast driver performance ranking update
   */
  broadcastDriverRankings(rankings: any[]) {
    this.server.to('admin').emit('driverRankings', rankings);

    // Send individual driver their ranking
    rankings.forEach((ranking) => {
      this.server.to(`driver_analytics_${ranking.driverId}`).emit('myRanking', {
        rank: ranking.rank,
        score: ranking.score,
        category: ranking.category,
      });
    });
  }
}
